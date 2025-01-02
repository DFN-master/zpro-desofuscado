import { TodoList } from "../../models/TodoListZPRO";
import AppError from "../../errors/AppErrorZPRO";

interface DeleteTodoListRequest {
  id: number;
  tenantId: number;
}

const DeleteTodoListService = async ({
  id,
  tenantId
}: DeleteTodoListRequest): Promise<void> => {
  const todoList = await TodoList.findOne({
    where: {
      id,
      tenantId
    }
  });

  if (!todoList) {
    throw new AppError("ERR_NO_TODOLIST_FOUND", 404);
  }

  try {
    await todoList.destroy();
  } catch (error) {
    throw new AppError("ERR_NO_TODOLIST_FOUND", 404);
  }
};

export default DeleteTodoListService; 