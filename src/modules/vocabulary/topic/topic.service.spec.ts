import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TopicService } from './topic.service';
import { Topic } from './entities/topic.entity';

describe('TopicService', () => {
  let service: TopicService;

  const mockTopic = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Daily Life',
    titleVi: 'Đời sống thường nhật',
    slug: 'daily-life',
    level: 'A1',
    themeColor: 'emerald',
    iconName: 'BookOpen',
    imageUrl: 'https://example.com/image.jpg',
    description: 'Mô tả',
    status: 'published',
    featured: true,
    order: 1,
  };

  const mockTopicModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOneAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicService,
        {
          provide: getModelToken(Topic.name),
          useValue: mockTopicModel,
        },
      ],
    }).compile();

    service = module.get<TopicService>(TopicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if slug already exists', async () => {
      mockTopicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTopic),
      });

      await expect(
        service.create({
          title: 'Daily Life',
          titleVi: 'Đời sống thường nhật',
          slug: 'daily-life',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new topic successfully and auto-assign order', async () => {
      mockTopicModel.findOne
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue(null),
        })
        .mockReturnValueOnce({
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue({ order: 2 }),
        });

      mockTopicModel.create.mockResolvedValue({
        ...mockTopic,
        order: 3,
      });

      const result = await service.create({
        title: 'Daily Life',
        titleVi: 'Đời sống thường nhật',
        slug: 'daily-life',
      });

      expect(result.success).toBe(true);
      expect(result.data.order).toBe(3);
    });
  });

  describe('findAll', () => {
    it('should return paginated list', async () => {
      mockTopicModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockTopic]),
      });

      mockTopicModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if topic not found', async () => {
      mockTopicModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockTopicModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should find topic by id or slug', async () => {
      mockTopicModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTopic),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTopic);
    });
  });

  describe('update', () => {
    it('should update topic successfully', async () => {
      mockTopicModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTopic),
      });
      mockTopicModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockTopic, title: 'Updated' }),
      });

      const result = await service.update('507f1f77bcf86cd799439011', {
        title: 'Updated',
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete topic successfully', async () => {
      mockTopicModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTopic),
      });

      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result.success).toBe(true);
      expect(result.data.deletedId).toBe('507f1f77bcf86cd799439011');
    });
  });
});
