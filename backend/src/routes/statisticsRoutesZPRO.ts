import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as StatisticsController from '../controllers/Statistics/StatisticsControllerZPRO';
import * as StatisticsPerUsersController from '../controllers/Statistics/StatisticsPerUsersControllerZPRO';
import * as DashController from '../controllers/Statistics/DashTicketsControllerZPRO';

const statisticsRoutes: Router = Router();

// Rotas de estatísticas
statisticsRoutes.get(
  '/statistics/report',
  isAuthZPRO,
  StatisticsController.getStatisticsReport
);

statisticsRoutes.get(
  '/contacts-report',
  isAuthZPRO,
  StatisticsController.getContactsReport
);

statisticsRoutes.get(
  '/statistics-per-users',
  isAuthZPRO,
  StatisticsPerUsersController.index
);

// Rotas de dashboard
statisticsRoutes.get(
  '/dash-tickets-queues',
  isAuthZPRO,
  DashController.getDashTicketsQueues
);

statisticsRoutes.get(
  '/dash-tickets-channels',
  isAuthZPRO,
  DashController.getDashTicketsChannels
);

statisticsRoutes.get(
  '/dash-tickets-per-users-channels',
  isAuthZPRO,
  DashController.getDashTicketsChannelsByPeriod
);

statisticsRoutes.get(
  '/dash-tickets-per-users-queue',
  isAuthZPRO,
  DashController.getDashTicketsQueuesByPeriod
);

statisticsRoutes.get(
  '/dash-tickets-evolution-times',
  isAuthZPRO,
  DashController.getDashTicketsEvolutionTimes
);

statisticsRoutes.get(
  '/dash-tickets-status',
  isAuthZPRO,
  DashController.getDashTicketsStatus
);

statisticsRoutes.get(
  '/dash-tickets-user',
  isAuthZPRO,
  DashController.getDashTicketsUser
);

statisticsRoutes.get(
  '/dash-tickets-detail',
  isAuthZPRO,
  DashController.getDashTicketsDetail
);

export default statisticsRoutes; 