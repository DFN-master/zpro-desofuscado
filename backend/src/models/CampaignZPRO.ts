import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
  HasMany,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
  AfterFind,
  DataType
} from 'sequelize-typescript';

import CampaignContactsZPRO from './CampaignContactsZPRO';
import TenantZPRO from './TenantZPRO';
import UserZPRO from './UserZPRO';
import WhatsappZPRO from './WhatsappZPRO';

export type CampaignStatus = 'pending' | 'processing' | 'canceled' | 'finished' | 'scheduled';

@Table
export default class Campaign extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  start: Date;

  @Column(DataType.ENUM('pending', 'processing', 'canceled', 'finished', 'scheduled'))
  status: CampaignStatus;

  @Column
  message1: string;

  @Column
  message2: string;

  @Column
  message3: string;

  @Column(DataType.STRING)
  mediaUrl: string | null;

  @Column
  mediaType: string;

  @ForeignKey(() => UserZPRO)
  @Column
  userId: number;

  @BelongsTo(() => UserZPRO)
  user: UserZPRO;

  @ForeignKey(() => WhatsappZPRO)
  @Column
  sessionId: number;

  @BelongsTo(() => WhatsappZPRO)
  session: WhatsappZPRO;

  @ForeignKey(() => TenantZPRO)
  @Column
  tenantId: number;

  @BelongsTo(() => TenantZPRO)
  tenant: TenantZPRO;

  @HasMany(() => CampaignContactsZPRO)
  campaignContacts: CampaignContactsZPRO[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column
  delay: number;

  get mediaUrl(): string | null {
    const url = this.getDataValue('mediaUrl');
    if (url && url !== 'null') {
      const { BACKEND_URL, PROXY_PORT } = process.env;
      const tenantId = this.tenantId || this.tenant?.id;
      return `${BACKEND_URL}:${PROXY_PORT}/public/${tenantId}/${url}`;
    }
    return null;
  }

  @AfterFind
  static async afterFind(campaigns: Campaign[] | Campaign): Promise<Campaign[] | Campaign> {
    if (!Array.isArray(campaigns)) return campaigns;

    const updatedCampaigns = await Promise.all(
      campaigns.map(async (campaign) => {
        if (!['processing', 'scheduled', 'finished'].includes(campaign.status)) {
          const contactsCount = +campaign.dataValues.contactsCount;
          const contactsLidas = +campaign.dataValues.contactsLidas;
          const recebidas = +campaign.dataValues.recebidas;
          const pendentesEnvio = +campaign.dataValues.pendentesEnvio;
          const updatedInstances = +campaign.dataValues.updatedInstances;
          const total = contactsLidas + recebidas;

          if (campaign.status !== 'canceled' && updatedInstances !== contactsLidas) {
            return campaign;
          }

          if (updatedInstances < total) {
            campaign.status = 'processing';
            await campaign.update({ status: 'processing' });
          }

          if (updatedInstances >= total) {
            campaign.status = 'scheduled';
            await campaign.update({ status: 'scheduled' });
          }
        }
        return campaign;
      })
    );

    return updatedCampaigns;
  }
} 