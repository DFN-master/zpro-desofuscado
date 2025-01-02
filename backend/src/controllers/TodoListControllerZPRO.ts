import { Request, Response } from 'express';
import * as Yup from 'yup';
import AppError from '../errors/AppErrorZPRO';
import CreateTodoListService from '../services/TodoListServices/CreateTodoListServiceZPRO';
import ListTodoListService from '../services/TodoListServices/ListTodoListServiceZPRO';
import DeleteTodoListService from '../services/TodoListServices/DeleteTodoListServiceZPRO';
import UpdateTodoListService from '../services/TodoListServices/UpdateTodoListServiceZPRO';
import ShowLogTodoListService from '../services/TodoListServices/ShowLogTodoListServiceZPRO';

interface TodoListData {
  name: string;
  description: string;
  owner: string;
  status: string;
  priority: string;
  userId: number;
  tenantId: number;
}

interface RequestUser {
  id: number;
  tenantId: number;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user as RequestUser;

  const data: TodoListData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    description: Yup.string().required(),
    owner: Yup.string().required(),
    status: Yup.string().required(), 
    priority: Yup.string().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const todoList = await CreateTodoListService(data);
  return res.status(200).json(todoList);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user as RequestUser;
  const todoLists = await ListTodoListService({ tenantId });
  return res.status(200).json(todoLists);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user as RequestUser;

  const data: TodoListData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    description: Yup.string().required(),
    owner: Yup.string().required(),
    status: Yup.string().required(),
    priority: Yup.string().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { todoListId } = req.params;
  const todoList = await UpdateTodoListService({
    todoListData: data,
    todoListId
  });

  return res.status(200).json(todoList);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user as RequestUser;
  const { todoListId } = req.params;

  await DeleteTodoListService({
    id: todoListId,
    tenantId
  });

  return res.status(200).json({ message: "Todolist deleted" });
};

export const showLogsTodoList = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.params;
  const logs = await ShowLogTodoListService({ userId });
  return res.status(200).json(logs);
}; 