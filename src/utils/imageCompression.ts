import ImageResizer from '@bam.tech/react-native-image-resizer';
// import {Platform} from 'react-native';


//  Compress an image located at the given URI for upload
export async function compressImageForUpload(
  uri: string,
): Promise<{uri: string; width: number; height: number}> {
  try {
    const result = await ImageResizer.createResizedImage(
      uri,
      800, // maxWidth
      800, // maxHeight
      'JPEG',
      80, // quality (0-100)
      0, // rotation
      undefined, // outputPath (auto)
      false, // keepMeta
      {
        mode: 'contain', // maintain aspect ratio
        onlyScaleDown: true, // only resize if larger
      },
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    // Fallback to original if compression fails
    return {uri, width: 0, height: 0};
  }
}
