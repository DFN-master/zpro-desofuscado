import TodoListZPRO from '../../models/TodoListZPRO';

interface CreateTodoListData {
  name: string;
  description: string;
  limitDate: Date;
  owner: string;
  status: string;
  priority: string;
  comments: string;
  userId: number;
  tenantId: number;
}

const CreateTodoListService = async ({
  name,
  description,
  limitDate,
  owner,
  status,
  priority,
  comments,
  userId,
  tenantId
}: CreateTodoListData): Promise<typeof TodoListZPRO> => {
  const todoList = await TodoListZPRO.create({
    name,
    description,
    limitDate,
    owner,
    status,
    priority,
    comments,
    userId,
    tenantId
  });

  return todoList;
};

export default CreateTodoListService; 