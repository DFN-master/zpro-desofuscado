import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as TodoListController from '../controllers/TodoListControllerZPRO';

const todoListRoutes: Router = Router();

// Rotas para gerenciamento de TodoLists
todoListRoutes.get('/todoLists', isAuthZPRO, TodoListController.index);
todoListRoutes.post('/todoLists', isAuthZPRO, TodoListController.store);
todoListRoutes.put('/todoLists/:todoListId', isAuthZPRO, TodoListController.update);
todoListRoutes.delete('/todoLists/:todoListId', isAuthZPRO, TodoListController.remove);
todoListRoutes.post('/todoLists/:userId/logs', isAuthZPRO, TodoListController.showLogsTodoList);

export default todoListRoutes; 