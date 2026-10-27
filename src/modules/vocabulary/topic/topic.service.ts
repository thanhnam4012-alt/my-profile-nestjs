import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Topic, TopicDocument } from './entities/topic.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { QueryTopicDto } from './dto/query-topic.dto';

@Injectable()
export class TopicService {
  constructor(
    @InjectModel(Topic.name)
    private readonly topicModel: Model<TopicDocument>,
  ) {}

  async create(createTopicDto: CreateTopicDto) {
    const slug = createTopicDto.slug.trim().toLowerCase();

    // Check slug conflict
    const existing = await this.topicModel.findOne({ slug }).exec();
    if (existing) {
      throw new ConflictException(
        `Chủ đề với slug "${slug}" đã tồn tại trong hệ thống.`,
      );
    }

    // Auto order if not provided
    let order = createTopicDto.order;
    if (order === undefined || order === null) {
      const highest = await this.topicModel
        .findOne()
        .sort({ order: -1 })
        .select('order')
        .exec();
      order = (highest?.order ?? 0) + 1;
    }

    const createdTopic = await this.topicModel.create({
      ...createTopicDto,
      slug,
      order,
    });

    return {
      success: true,
      message: 'Tạo chủ đề từ vựng thành công',
      data: createdTopic,
    };
  }

  async findAll(query: QueryTopicDto) {
    const filter: Record<string, any> = {};

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { titleVi: searchRegex },
        { description: searchRegex },
        { slug: searchRegex },
      ];
    }

    if (query.level && query.level !== 'all') {
      filter.level = query.level;
    }

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.featured !== undefined) {
      filter.featured = query.featured;
    }

    const sortField = query.sortBy || 'order';
    const sortDirection = query.sortOrder === 'desc' ? -1 : 1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

    if (query.all === true || query.limit === 0) {
      const items = await this.topicModel.find(filter).sort(sortOptions).exec();

      return {
        success: true,
        data: items,
        pagination: {
          page: 1,
          limit: items.length,
          total: items.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.topicModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.topicModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findOne(idOrSlug: string) {
    let topic: TopicDocument | null = null;

    if (isValidObjectId(idOrSlug)) {
      topic = await this.topicModel.findById(idOrSlug).exec();
    }

    if (!topic) {
      topic = await this.topicModel.findOne({ slug: idOrSlug }).exec();
    }

    if (!topic) {
      throw new NotFoundException(
        `Không tìm thấy chủ đề từ vựng với mã hoặc slug "${idOrSlug}".`,
      );
    }

    return {
      success: true,
      data: topic,
    };
  }

  async update(idOrSlug: string, updateTopicDto: UpdateTopicDto) {
    let topic: TopicDocument | null = null;

    if (isValidObjectId(idOrSlug)) {
      topic = await this.topicModel.findById(idOrSlug).exec();
    }

    if (!topic) {
      topic = await this.topicModel.findOne({ slug: idOrSlug }).exec();
    }

    if (!topic) {
      throw new NotFoundException(
        `Không tìm thấy chủ đề từ vựng với mã hoặc slug "${idOrSlug}".`,
      );
    }

    // Check slug conflict if slug is being updated
    if (updateTopicDto.slug) {
      const newSlug = updateTopicDto.slug.trim().toLowerCase();
      if (newSlug !== topic.slug) {
        const slugExists = await this.topicModel
          .findOne({
            slug: newSlug,
            _id: { $ne: topic._id },
          })
          .exec();

        if (slugExists) {
          throw new ConflictException(
            `Chủ đề với slug "${newSlug}" đã tồn tại trong hệ thống.`,
          );
        }
        updateTopicDto.slug = newSlug;
      }
    }

    const updated = await this.topicModel
      .findByIdAndUpdate(topic._id, updateTopicDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    return {
      success: true,
      message: 'Cập nhật chủ đề từ vựng thành công',
      data: updated,
    };
  }

  async remove(idOrSlug: string) {
    let topic: TopicDocument | null = null;

    if (isValidObjectId(idOrSlug)) {
      topic = await this.topicModel.findByIdAndDelete(idOrSlug).exec();
    }

    if (!topic) {
      topic = await this.topicModel.findOneAndDelete({ slug: idOrSlug }).exec();
    }

    if (!topic) {
      throw new NotFoundException(
        `Không tìm thấy chủ đề từ vựng với mã hoặc slug "${idOrSlug}".`,
      );
    }

    return {
      success: true,
      message: 'Xóa chủ đề từ vựng thành công',
      data: {
        deletedId: topic._id.toString(),
        slug: topic.slug,
      },
    };
  }
}
