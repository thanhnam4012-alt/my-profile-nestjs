import { Test, TestingModule } from '@nestjs/testing';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';

describe('TopicController', () => {
  let controller: TopicController;

  const mockTopicService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicController],
      providers: [
        {
          provide: TopicService,
          useValue: mockTopicService,
        },
      ],
    }).compile();

    controller = module.get<TopicController>(TopicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call topicService.create', async () => {
    mockTopicService.create.mockResolvedValue({ success: true });
    const dto = {
      title: 'Daily Life',
      titleVi: 'Đời sống thường nhật',
      slug: 'daily-life',
    };
    await controller.create(dto);
    expect(mockTopicService.create).toHaveBeenCalledWith(dto);
  });

  it('should call topicService.findAll', async () => {
    mockTopicService.findAll.mockResolvedValue({ success: true, data: [] });
    const query = { page: 1, limit: 10 };
    await controller.findAll(query);
    expect(mockTopicService.findAll).toHaveBeenCalledWith(query);
  });

  it('should call topicService.findOne', async () => {
    mockTopicService.findOne.mockResolvedValue({ success: true });
    await controller.findOne('123');
    expect(mockTopicService.findOne).toHaveBeenCalledWith('123');
  });

  it('should call topicService.update on patch', async () => {
    mockTopicService.update.mockResolvedValue({ success: true });
    await controller.update('123', { title: 'Updated' });
    expect(mockTopicService.update).toHaveBeenCalledWith('123', {
      title: 'Updated',
    });
  });

  it('should call topicService.remove on delete', async () => {
    mockTopicService.remove.mockResolvedValue({ success: true });
    await controller.remove('123');
    expect(mockTopicService.remove).toHaveBeenCalledWith('123');
  });
});
