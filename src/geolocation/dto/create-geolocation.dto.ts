import { IsNotEmpty, IsLatitude, IsLongitude } from 'class-validator';

export class CreateGeolocationDto {
  @IsNotEmpty({ message: 'La latitud no puede estar vacía' })
  @IsLatitude({ message: 'El valor proporcionado no es una latitud válida' })
  latitude: number;

  @IsNotEmpty({ message: 'La longitud no puede estar vacía' })
  @IsLongitude({ message: 'El valor proporcionado no es una longitud válida' })
  longitude: number;
}