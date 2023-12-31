import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from '../models/user/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Error, Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from '../core/entities';
import { UserDto, UserProfileDto } from '../models';
import { IPagingParams } from '../core/contracts';
import { PagedListExtensions } from './extensions';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService) { }

  async create(createUserDto: CreateUserDto) {
    const { email } = createUserDto;

    // Kiểm tra xem email đã tồn tại hay chưa
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new Error('Email is existed');
    }

    const createdUser = new this.userModel(createUserDto);

    createdUser.joinedDate = new Date();

    createdUser.save();

    const userDto = new UserDto(createdUser);

    const payload = { sub: createdUser._id, username: createdUser.email };

    const access_token = {
      access_token: await this.jwtService.signAsync(payload),
    }

    Object.assign(userDto, access_token);

    return userDto;
  }

  async findAll(keyword: string, pagingParams: IPagingParams) {

    const searchConditions = {
      $or: [
        { email: { $regex: keyword, $options: 'i' } },
      ],
    };

    const userList = await this.userModel.find(searchConditions).exec()
      .catch((error) => {
        throw new Error(error.message);
      });

    return PagedListExtensions.toPagedList(userList, pagingParams);
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email: email });

    if (!user) {
      throw new NotFoundException('Email is incorrect');
    }

    if (user?.password !== password) {
      throw new NotFoundException('Password is incorrect');
    }
    const userDto = new UserDto(user);

    const payload = { sub: user._id, username: user.email };
    const access_token = {
      access_token: await this.jwtService.signAsync(payload),
    }

    Object.assign(userDto, access_token);

    return userDto;
  }

  findOne(id: string) {
    return this.userModel.findOne({ _id: id });
  }

  async update(id: string, updateUserDto: UserProfileDto) {
    const user = await this.userModel.findOne({ _id: id }).exec();

    if (!user) {
      // If the user is not found, return null or handle the error accordingly
      throw new NotFoundException('User is not found');
    }

    // Update the user's profile with the new data
    Object.assign(user, updateUserDto);

    // Save the updated user
    const updatedUser = await user.save();

    const userDto = new UserDto(updatedUser);

    const payload = { sub: updatedUser._id, username: updatedUser.email };

    const access_token = {
      access_token: await this.jwtService.signAsync(payload),
    }

    Object.assign(userDto, access_token);

    return userDto;
  }

  async setAvatar(user: User, avatar: string, public_id: string) {

    if (!user) {
      // If the user is not found, return null or handle the error accordingly
      return null;
    }

    const updateUserDto = {
      avatarUrl: avatar,
      publicUrl: public_id
    }

    // Update the user's profile with the new data
    Object.assign(user, updateUserDto);
    await user.save();
    const userDto = new UserDto(user);
    return userDto;
  }

  async remove(id: string) {
    const existingUser = await this.userModel.findOne({ _id: id }).exec();
    if (!existingUser) {
      throw new Error('User is deleted.');
    }
    return await this.userModel.deleteOne({ _id: id });
  }
}
