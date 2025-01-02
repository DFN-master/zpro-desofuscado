import { logger } from '../utils/loggerZPRO';
import TenantZPRO from '../models/TenantZPRO';
import DeleteTenantService from '../services/TenantServices/DeleteTenantServiceZPRO';

interface ICheckTenantsTrialJob {
  handle(): Promise<void>;
}

export const CheckTenantsTrialJob: ICheckTenantsTrialJob = {
  async handle(): Promise<void> {
    try {
      const tenants = await TenantZPRO.findAll({
        order: [['name', 'ASC']]
      });

      const currentDate = new Date();

      for (const tenant of tenants) {
        if (tenant.status === 'trial') {
          // Calcula data final do período trial
          const trialEndDate = new Date(tenant.createdAt);
          trialEndDate.setDate(trialEndDate.getDate() + tenant.trialPeriod);

          // Se passou do período trial, marca como inativo
          if (currentDate > trialEndDate) {
            tenant.status = 'inactive';
            await tenant.save();
          }

          // Calcula data de deleção (7 dias após fim do trial)
          const deletionDate = new Date(trialEndDate);
          deletionDate.setDate(deletionDate.getDate() + 7);

          // Se está inativo e passou da data de deleção, remove o tenant
          if (tenant.status === 'inactive' && currentDate > deletionDate) {
            await DeleteTenantService({ id: tenant.id.toString() });
          }
        }

        logger.info(
          `::: Z-PRO ::: ZDG ::: Tenant: ${tenant.name}, Status: ${tenant.status}, Trial: ${tenant.status}, Trial Period: ${tenant.trialPeriod}`
        );
      }
    } catch (error) {
      logger.warn(
        `::: Z-PRO ::: ZDG ::: Error ao checar tenants: ${JSON.stringify(error)}`
      );
    }
  }
}; 