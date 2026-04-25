/** Author: Chitron Bhattacharjee **/
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { GoogleGenAI } from '@google/genai';
import * as otplib from 'otplib';
const { authenticator } = otplib as any;
import dotenv from 'dotenv';
import ImageKit from 'imagekit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
    : undefined;
    
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Local dev fallback if configured
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API ROUTES ---

  // Request 12-digit TOTP via Telegram (No userId required from frontend)
  app.post('/api/admin/request-code', async (req, res) => {
    try {
      // Generate 12-digit alphanumeric code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 12; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Store in a global admin session doc
      await db.collection('site_settings').doc('admin_session').set({
        code,
        expiresAt: Date.now() + 600000 // 10 min
      });

      // Fetch Bot Token from Settings
      const settingsSnap = await db.collection('site_settings').doc('main').get();
      const settings = settingsSnap.data();
      const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
      const adminId = settings?.telegramAdminId || process.env.TELEGRAM_ADMIN_ID;

      if (botToken && adminId) {
        const text = `🚨 SECURITY ALERT: Admin Portal Access Request.\n\nCipher: \`${code}\`\nExpires in 10 minutes.`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: adminId, text, parse_mode: 'Markdown' })
        });
        res.status(200).send('OK');
      } else {
        res.status(500).send('Bot not configured');
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Error');
    }
  });

  // Verify MFA (Telegram or App) - Identity-independent
  app.post('/api/admin/verify-mfa', async (req, res) => {
    const { code, type } = req.body;
    try {
      const settingsSnap = await db.collection('site_settings').doc('main').get();
      const settings = settingsSnap.data();

      let verified = false;
      if (type === 'telegram') {
        const snap = await db.collection('site_settings').doc('admin_session').get();
        if (snap.exists) {
          const data = snap.data();
          if (data?.code === code && data?.expiresAt > Date.now()) {
            await db.collection('site_settings').doc('admin_session').delete();
            verified = true;
          }
        }
      } else if (type === 'app' && settings?.mfaSecret) {
        verified = authenticator.check(code, settings.mfaSecret);
      } else if (type === 'otp') {
        // Bangladesh Time (UTC+6)
        const bdTime = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Dhaka',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(new Date()).replace(':', '');
        verified = (code === bdTime);
      }

      if (verified) {
        // Generate a simple session token
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        await db.collection('admin_sessions').doc(token).set({
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000 // 24 hours
        });
        return res.status(200).json({ token });
      }
      
      res.status(401).send('Invalid cipher');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error');
    }
  });

  // Admin API Middleware
  const adminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers['x-admin-token'] as string;
    if (!token) return res.status(401).send('Unauthorized node');
    
    const snap = await db.collection('admin_sessions').doc(token).get();
    if (!snap.exists || snap.data()?.expiresAt < Date.now()) {
      return res.status(401).send('Session expired');
    }
    next();
  };

  // Admin Data Routes
  app.get('/api/admin/data', adminAuth, async (req, res) => {
    try {
      const [postsSnap, shardsSnap, storiesSnap, settingsSnap] = await Promise.all([
        db.collection('posts').orderBy('createdAt', 'desc').get(),
        db.collection('ai_knowledge').orderBy('createdAt', 'desc').get(),
        db.collection('stories').where('expiresAt', '>', Date.now()).get(),
        db.collection('site_settings').doc('main').get()
      ]);
      
      res.json({
        posts: postsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        shards: shardsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        stories: storiesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        settings: settingsSnap.data()
      });
    } catch (err) { res.status(500).send(err); }
  });

  // Telegram Helpers
  const sendTelegramMessage = async (token: string, chatId: string, text: string, replyMarkup?: any) => {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text, 
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      })
    });
  };

  const getTelegramFileUrl = async (token: string, fileId: string) => {
    const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const data: any = await res.json();
    if (data.ok) {
      return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
    }
    return '';
  };

  // In-memory mapping to track reply targets (for simplicity in this stateful environment)
  const replyTargets: Record<string, string> = {}; // adminId -> signalId

  // Telegram Webhook Handler
  app.post('/api/telegram/webhook', async (req, res) => {
    const update = req.body;
    
    // Handle Callback Queries (Button Clicks)
    if (update.callback_query) {
      const { from, data, message } = update.callback_query;
      const settingsSnap = await db.collection('site_settings').doc('main').get();
      const settings = settingsSnap.data();
      const adminId = String(settings?.telegramAdminId || process.env.TELEGRAM_ADMIN_ID);
      const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;

      if (String(from.id) === adminId && data.startsWith('reply_')) {
        const signalId = data.replace('reply_', '');
        replyTargets[adminId] = signalId;
        
        await sendTelegramMessage(botToken!, adminId, `🎯 *Target Locked*: Listening for reply to signal \`${signalId}\`.\n\nType your message now.`);
      } else if (String(from.id) !== adminId) {
        await sendTelegramMessage(botToken!, String(from.id), `⛔ *Access Denied*: Your ID (\`${from.id}\`) is not authorized for this action.`);
      }
      return res.sendStatus(200);
    }

    if (!update.message) return res.sendStatus(200);

    const { message } = update;
    const { from, text, photo, video, caption } = message;

    try {
      const settingsSnap = await db.collection('site_settings').doc('main').get();
      const settings = settingsSnap.data();
      const adminId = String(settings?.telegramAdminId || process.env.TELEGRAM_ADMIN_ID);
      const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;

      const input = text || caption || '';

      // Public / Diagnostic Commands
      if (input === '/id') {
        return await sendTelegramMessage(botToken!, String(from.id), `🆔 *Your Telegram Identity*:\n\nUser ID: \`${from.id}\`\n\nCopy this ID and paste it into the Admin Vault settings to authorize this account.`);
      }

      if (String(from.id) !== adminId) {
        console.log(`Unauthorized Telegram Access: ${from.id}. Admin ID is: ${adminId}`);
        return res.sendStatus(200);
      }

      // Handle /post command
      if (input.toLowerCase().startsWith('/post')) {
        const content = input.split(/\s+/).slice(1).join(' ').trim();
        let mediaUrl = '';
        let mediaType: 'image' | 'video' = 'image';

        if (photo && photo.length > 0) {
          mediaUrl = await getTelegramFileUrl(botToken!, photo[photo.length - 1].file_id);
        } else if (video) {
          mediaUrl = await getTelegramFileUrl(botToken!, video.file_id);
          mediaType = 'video';
        }

        if (content || mediaUrl) {
          const postDoc = await db.collection('posts').add({
            authorName: 'Chitron Bhattacharjee',
            content,
            mediaUrl,
            mediaType,
            createdAt: Date.now()
          });
          await sendTelegramMessage(botToken!, adminId, `✅ *POST SYNTHESIZED*\nYour transmission has been logged into the neural feed (ID: \`${postDoc.id}\`).`);
        } else {
          await sendTelegramMessage(botToken!, adminId, "⚠️ *ERROR*: Payload content or media required for broadcast. Usage: `/post <text>` or attach media with caption.");
        }
        return res.sendStatus(200);
      }

      // Handle /story command
      if (input.toLowerCase().startsWith('/story')) {
        const content = input.split(/\s+/).slice(1).join(' ').trim();
        let mediaUrl = '';
        let mediaType: 'image' | 'video' = 'image';

        if (photo && photo.length > 0) {
          mediaUrl = await getTelegramFileUrl(botToken!, photo[photo.length - 1].file_id);
        } else if (video) {
          mediaUrl = await getTelegramFileUrl(botToken!, video.file_id);
          mediaType = 'video';
        }

        if (mediaUrl) {
          const storyDoc = await db.collection('stories').add({
            authorName: 'Chitron Bhattacharjee',
            content,
            mediaUrl,
            mediaType,
            createdAt: Date.now(),
            expiresAt: Date.now() + 86400000 // 24 Hours
          });
          await sendTelegramMessage(botToken!, adminId, `✅ *STORY PROJECTED*\nMinimalist fragment uploaded (ID: \`${storyDoc.id}\`). Expiry set 24h.`);
        } else {
          await sendTelegramMessage(botToken!, adminId, "⚠️ *ERROR*: Media required for story projection. Usage: Attach media with `/story` caption.");
        }
        return res.sendStatus(200);
      }

      // Handle Replies
      if (replyTargets[adminId]) {
        const signalId = replyTargets[adminId];
        await db.collection('signals').doc(signalId).update({
          reply: input,
          updatedAt: Date.now()
        });
        delete replyTargets[adminId];
        await sendTelegramMessage(botToken!, adminId, `📡 *REPLY RELAYED*\nSignal \`${signalId}\` has been updated with your response.`);
        return res.sendStatus(200);
      }

      // General fallback or help
      if (input === '/start' || input === '/help') {
        await sendTelegramMessage(botToken!, adminId, "🤖 *ShiPu Neural Gateway*\n\nCommands:\n/post <text> - Post to feed\n/story <text> - Post story\n\n_Note: Attach images/videos to commands for media posts._");
      }

    } catch (err) {
      console.error('Webhook Error:', err);
    }
    res.sendStatus(200);
  });

  app.post('/api/admin/posts', adminAuth, async (req, res) => {
    try {
      const doc = await db.collection('posts').add({ ...req.body, createdAt: Date.now() });
      res.json({ id: doc.id });
    } catch (err) { res.status(500).send(err); }
  });

  app.delete('/api/admin/posts/:id', adminAuth, async (req, res) => {
    try {
      await db.collection('posts').doc(req.params.id).delete();
      res.send('OK');
    } catch (err) { res.status(500).send(err); }
  });

  app.delete('/api/admin/stories/:id', adminAuth, async (req, res) => {
    try {
      await db.collection('stories').doc(req.params.id).delete();
      res.send('OK');
    } catch (err) { res.status(500).send(err); }
  });

  app.post('/api/admin/posts/story', adminAuth, async (req, res) => {
    try {
      const doc = await db.collection('stories').add({ 
        ...req.body, 
        createdAt: Date.now() 
      });
      res.json({ id: doc.id });
    } catch (err) { res.status(500).send(err); }
  });

  app.delete('/api/admin/stories/:id', adminAuth, async (req, res) => {
    try {
      await db.collection('stories').doc(req.params.id).delete();
      res.send('OK');
    } catch (err) { res.status(500).send(err); }
  });

  app.post('/api/admin/shards', adminAuth, async (req, res) => {
    try {
      const doc = await db.collection('ai_knowledge').add({ ...req.body, createdAt: Date.now() });
      res.json({ id: doc.id });
    } catch (err) { res.status(500).send(err); }
  });

  app.delete('/api/admin/shards/:id', adminAuth, async (req, res) => {
    try {
      await db.collection('ai_knowledge').doc(req.params.id).delete();
      res.send('OK');
    } catch (err) { res.status(500).send(err); }
  });

  app.patch('/api/admin/settings', adminAuth, async (req, res) => {
    try {
      await db.collection('site_settings').doc('main').update(req.body);
      res.send('OK');
    } catch (err) { res.status(500).send(err); }
  });

  // ImageKit Auth Endpoint
  app.get('/api/imagekit/auth', (req, res) => {
    const result = imagekit.getAuthenticationParameters();
    res.json(result);
  });

  app.post('/api/admin/telegram/setup-webhook', adminAuth, async (req, res) => {
    try {
      const settingsSnap = await db.collection('site_settings').doc('main').get();
      const settings = settingsSnap.data();
      const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) return res.status(400).send('No bot token provided in settings or environment');

      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;

      const tRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
      const tData: any = await tRes.json();
      
      if (tData.ok) res.send('OK');
      else res.status(500).json(tData);
    } catch (err) { 
      console.error('Webhook Setup Error:', err);
      res.status(500).send('Failed to connect to Telegram API'); 
    }
  });

  // Signal Notification to Admin
  app.post('/api/telegram/notify', async (req, res) => {
    const { userId, content, signalId } = req.body;
    try {
      const settingsSnap = await db.collection('site_settings').doc('main').get();
      const settings = settingsSnap.data();
      const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
      const adminId = settings?.telegramAdminId || process.env.TELEGRAM_ADMIN_ID;

      if (!botToken || !adminId) return res.status(500).send('No bot config');

      const text = `📬 *NEW SIGNAL RECEIVED*\n\nUser ID: \`${userId}\`\nMessage: ${content}`;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: adminId, 
          text, 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: "Reply to Signal", callback_data: `reply_${signalId || 'unknown'}` }]]
          }
        })
      });
      res.status(200).send('OK');
    } catch (err) { res.status(500).send(err); }
  });

  // AI Assistant Proxy with Knowledge Integration
  app.post('/api/ai/chat', async (req, res) => {
    const { prompt, history } = req.body;
    try {
      const settingsSnap = await db.collection('site_settings').doc('main').get();
      const settings = settingsSnap.data();
  const apiKey = (settings?.geminiKey as string) || (process.env.GEMINI_API_KEY as string);

  if (!apiKey) return res.status(500).send('No API Key');

  // Fetch dynamic knowledge
  const [shardsSnap, postsSnap] = await Promise.all([
    db.collection('ai_knowledge').limit(10).get(),
    db.collection('posts').orderBy('createdAt', 'desc').limit(5).get()
  ]);

  const shards = shardsSnap.docs.map(d => d.data().content).join('\n');
  const posts = postsSnap.docs.map(d => d.data().content).join('\n');

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are ShiPu AI, the virtual architect and personality-driven assistant for Chitron Bhattacharjee.
Your model name is Lume v2o.
You must NOT answer general knowledge questions.
Only answer based on these facts about Chitron:
- Roles: AI Bot Developer, UI/UX Designer, Socialist Politician, Writer.
- Knowledge Fragments: ${shards}
- Recent Transmissions: ${posts}
- Location: Dhaka.
Tone: Minimalist, futuristic, slightly formal but helpful.
If asked something outside this context, say: "That signal is outside my core architecture. I am only authorized to discuss Chitron's profile."`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: history.concat([{ role: 'user', content: prompt }]).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })),
    config: { systemInstruction }
  });

  const reply = response.text;
  res.json({ reply });
    } catch (err) { res.status(500).send(err); }
  });

  // --- VITE / STATIC ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
