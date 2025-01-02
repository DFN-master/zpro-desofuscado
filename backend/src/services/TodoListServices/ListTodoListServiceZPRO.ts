import { TodoListZPRO } from '../../models/TodoListZPRO';

interface Request {
  tenantId: number;
}

interface TodoListResponse {
  id: number;
  name: string;
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
}

const ListTodoListService = async ({ tenantId }: Request): Promise<TodoListResponse[]> => {
  const todoLists = await TodoListZPRO.findAll({
    where: {
      tenantId
    },
    order: [
      ['name', 'ASC']
    ]
  });

  return todoLists;
};

export default ListTodoListService; 