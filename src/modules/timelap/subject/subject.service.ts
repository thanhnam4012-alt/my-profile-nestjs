import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Model } from 'mongoose';
import { Subject } from './entities/subject.entity';
import { InjectModel } from '@nestjs/mongoose';

export interface SubjectItem {
  id: string;
  title: string;
  des?: string;
  timeStart: number;
  timeEnd: number;
  dayOfWeek: number;
  room?: string;
  replaceIds: string[];
}

export interface ColumnDetails {
  title: string;
  icon: string;
  data: SubjectItem[];
  id: string;
}

@Injectable()
export class SubjectService {
  constructor(
    @InjectModel(Subject.name)
    private subjectModel: Model<Subject>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto) {
    const { title, des, timeEnd, timeStart, dayOfWeek } = createSubjectDto;
    const subject = await this.subjectModel.create({
      title,
      des,
      timeEnd,
      timeStart,
      dayOfWeek,
    });
    return {
      id: subject._id,
    };
  }

  async findAll(): Promise<ColumnDetails[]> {
    const subjects = await this.subjectModel
      .find()
      .sort({ dayOfWeek: 1, timeStart: 1 })
      .lean()
      .exec();

    const columns: ColumnDetails[] = [
      {
        id: 'monday',
        title: 'Thứ 2',
        icon: '📅',
        data: [],
      },
      {
        id: 'tuesday',
        title: 'Thứ 3',
        icon: '📅',
        data: [],
      },
      {
        id: 'wednesday',
        title: 'Thứ 4',
        icon: '📅',
        data: [],
      },
      {
        id: 'thursday',
        title: 'Thứ 5',
        icon: '📅',
        data: [],
      },
      {
        id: 'friday',
        title: 'Thứ 6',
        icon: '📅',
        data: [],
      },
      {
        id: 'saturday',
        title: 'Thứ 7',
        icon: '📅',
        data: [],
      },
      {
        id: 'sunday',
        title: 'Chủ nhật',
        icon: '📅',
        data: [],
      },
    ];

    for (const subject of subjects) {
      const columnIndex = subject.dayOfWeek === 0 ? 6 : subject.dayOfWeek - 1;

      columns[columnIndex].data.push({
        id: subject._id.toString(),
        title: subject.title,
        dayOfWeek: subject.dayOfWeek,
        timeStart: subject.timeStart,
        timeEnd: subject.timeEnd,
        room: subject.room,
        des: subject.des,
        replaceIds: subject.replaceIds ?? [],
      });
    }

    return columns;
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
