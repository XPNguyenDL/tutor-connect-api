import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Res,
  HttpStatus,
  Req,
  UseGuards
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../models/dto/create-user.dto';
import { UpdateUserDto } from '../models/dto/update-user.dto';
import { ApiResponse } from '../models';
import { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('/api/users')
@ApiTags('User endpoints')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  findAll(@Res() res: Response) {
    this.usersService.findAll().then(response => {
      res.status(HttpStatus.OK).json(ApiResponse.Success(response))
    })
      .catch(error => {
        res.status(200).json(ApiResponse.Fail(HttpStatus.BAD_REQUEST, error.message));
      });
  }

  // @Get(':id')
  // findOne(@Param('id') id: string, @Res() res: Response) {
  //   this.usersService.findOne(id).then(response => {
  //     if (response) {
  //       res.status(200).json(ApiResponse.Success(response));
  //     } else {
  //       res.status(200).json(ApiResponse.Fail(HttpStatus.NOT_FOUND, "User is not found"));
  //     }
  //   })
  //     .catch(error => {
  //       res.status(200).json(ApiResponse.Fail(HttpStatus.BAD_REQUEST, error.message));
  //     });
  // }

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Req() req, @Res() res: Response) {
    const userData = req.user;
    await this.usersService.findOne(userData.sub).then((response) => {
      if (response) {
        res.status(200).json(ApiResponse.Success(response));
      } else {
        res.status(200).json(ApiResponse.Fail(HttpStatus.NOT_FOUND, "User is not found"));
      }
    })
  }
  
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    await this.usersService.create(createUserDto).then(response => {
      if (response) {
        res.status(200).json(ApiResponse.Success(response));
      } else {
        res.status(200).json(ApiResponse.Fail(HttpStatus.NOT_FOUND, "User is not found"));
      }
    })
      .catch(error => {
        res.status(200).json(ApiResponse.Fail(HttpStatus.BAD_REQUEST, error.message));
      });
  }

  @Post('login')
  async login(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const { email, password } = createUserDto;

    await this.usersService.login(email, password).then(response => {
      if (response) {
        res.status(200).json(ApiResponse.Success(response));
      } else {
        res.status(200).json(ApiResponse.Fail(HttpStatus.NOT_FOUND, "User is not found"));
      }
    })
      .catch(error => {
        res.status(200).json(ApiResponse.Fail(HttpStatus.BAD_REQUEST, error.message));
      });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
