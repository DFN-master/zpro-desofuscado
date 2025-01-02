import { Request } from 'express';
import TodoListZPRO from '../../models/TodoListZPRO';
import UserZPRO from '../../models/UserZPRO';

interface ShowLogTodoListRequest {
  userId: number;
}

interface TodoListAttributes {
  id: number;
  userId: number;
  createdAt: Date;
  // adicione outros atributos necessários aqui
}

const ShowLogTodoListService = async ({ userId }: ShowLogTodoListRequest): Promise<TodoListAttributes[]> => {
  const todoLists = await TodoListZPRO.findAll({
    where: {
      userId
    },
    include: [
      {
        model: UserZPRO,
        as: 'user',
        attributes: ['id', 'name']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return todoLists;
};

export default ShowLogTodoListService; 