// src/cloudinary/cloudinary.service.ts
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  uploadFile(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'ventasgps_logos' },
        (error, result) => {
          if (error) return reject(error);
          
          // ✅ CORRECCIÓN: Se añade una comprobación para asegurar que 'result' no sea undefined.
          if (!result) {
            return reject(new Error('Cloudinary did not return a result.'));
          }
          resolve(result);
        },
      );
      require('streamifier').createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}