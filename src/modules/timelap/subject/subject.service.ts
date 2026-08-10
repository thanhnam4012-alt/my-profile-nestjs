import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Model } from 'mongoose';
import { Subject } from './entities/subject.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SubjectService {
  constructor(
    @InjectModel(Subject.name)
    private subjectModel: Model<Subject>,
  ) { }

  async create(createSubjectDto: CreateSubjectDto) {
    const { title, des, timeEnd, timeStart } = createSubjectDto;
    const subject = await this.subjectModel.create({
      title,
      des,
      timeEnd,
      timeStart,
    });
    return {
      id: subject._id,
    };
  }

  async findAll() {
    return this.subjectModel.find().exec();
  }

  async findOne(id: string) {
    const subject = await this.subjectModel.findById(id).exec();

    if (!subject) {
      throw new NotFoundException(`Subject with id ${id} not found`);
    }

    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    const subject = await this.subjectModel
      .findByIdAndUpdate(id, updateSubjectDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!subject) {
      throw new NotFoundException(`Subject with id ${id} not found`);
    }

    return subject;
  }

  async remove(id: string) {
    const subject = await this.subjectModel.findByIdAndDelete(id).exec();

    if (!subject) {
      throw new NotFoundException(`Subject with id ${id} not found`);
    }

    return {
      id: subject._id,
    };
  }
}
