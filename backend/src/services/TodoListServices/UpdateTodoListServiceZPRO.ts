import AppError from '../../errors/AppError';
import TodoList from '../../models/TodoList';

interface ITodoListData {
  name?: string;
  description?: string;
  limitDate?: Date;
  owner?: string;
  status?: string;
  priority?: string;
  comments?: string;
  userId?: number;
  tenantId?: number;
}

interface IRequest {
  todoListData: ITodoListData;
  todoListId: number;
}

const UpdateTodoListService = async ({
  todoListData,
  todoListId
}: IRequest): Promise<TodoList> => {
  const {
    name,
    description,
    limitDate,
    owner,
    status,
    priority,
    comments,
    userId,
    tenantId
  } = todoListData;

  const todoList = await TodoList.findOne({
    where: { 
      id: todoListId,
      tenantId 
    },
    attributes: [
      'id',
      'name',
      'description',
      'limitDate',
      'owner',
      'status',
      'priority',
      'comments',
      'userId'
    ]
  });

  if (!todoList) {
    throw new AppError('ERR_NO_TODOLIST_FOUND', 404);
  }

  await todoList.update({
    name,
    description,
    limitDate,
    owner,
    status,
    priority,
    comments,
    userId
  });

  await todoList.reload({
    attributes: [
      'id',
      'name',
      'description', 
      'limitDate',
      'owner',
      'status',
      'priority',
      'comments',
      'userId'
    ]
  });

  return todoList;
};

export default UpdateTodoListService; 