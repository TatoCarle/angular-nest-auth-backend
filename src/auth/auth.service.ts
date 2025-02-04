import { LoginDto } from './dto/login.dto';
import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { JwtPayload } from './../../node_modules/@types/jsonwebtoken/index.d';

import * as bcryptjs from "bcryptjs";
import { JwtService } from '@nestjs/jwt';
import { LoginResponse } from './interfaces/login-response';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService
  ) { }


  async create(createUserDto: CreateUserDto): Promise<User> {
    console.log(createUserDto);

    try {

      const { password, ...userData } = createUserDto
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10), ...userData
      })

      // const newUser = new this.userModel(createUserDto)


      await newUser.save();

      const { password: _, ...user } = newUser.toJSON();
      return user;

    } catch (error) {
      if (error == 11000)
        throw new BadRequestException(`${createUserDto.email} ya existe en la base de datos`)


    }
    throw new InternalServerErrorException('Algo salio mal... Intentalo nuevamente')
  }


  async login(loginDto: LoginDto): Promise<LoginResponse> {

    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Not valid credentials - email');
    }

    if (!bcryptjs.compareSync(password, user.password)) {
      throw new UnauthorizedException('Not valid credentials - password');
    }

    const { password: _, ...rest } = user.toJSON();


    return {
      user: rest,

      token: this.getJwtToken({ id: user.id }),
      //token: 'ABC',

    }

  }

  findAll(): Promise<User[]> {
    return this.userModel.find()
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  async findUserById(id: string) {
    const user = await this.userModel.findById(id);
    const { password, ...rest } = user.toJSON();
    return rest;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }


  getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);

    console.log(token);

    return token;
  }


  async register(registerDto: RegisterUserDto): Promise<LoginResponse> {

    console.log('registerDto', registerDto);

    const user = await this.create(registerDto);

    return {
      user: user,
      token: this.getJwtToken({ id: user._id })
    }
  }
}
