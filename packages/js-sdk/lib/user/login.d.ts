import { User, UserData } from './user';
export declare function login<T extends UserData>(username: string, password: string): Promise<User<T>>;
