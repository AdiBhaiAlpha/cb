import ImageKit from 'imagekit-javascript';

const imagekit = new (ImageKit as any)({
  publicKey: (import.meta as any).env.VITE_IMAGEKIT_PUBLIC_KEY || '',
  urlEndpoint: (import.meta as any).env.VITE_IMAGEKIT_URL_ENDPOINT || '',
  authenticationEndpoint: `${window.location.origin}/api/imagekit/auth`,
});

export const uploadImage = async (file: File): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      imagekit.upload({
        file: file,
        fileName: `${Date.now()}_${file.name}`,
        tags: ["chitron-portal"],
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result?.url || '');
      });
    });
  } catch (error) {
    console.error('ImageKit Upload Error:', error);
    throw error;
  }
};

export default imagekit;
