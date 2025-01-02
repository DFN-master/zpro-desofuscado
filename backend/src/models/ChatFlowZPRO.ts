import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  BelongsTo,
  ForeignKey,
  DataType,
  CreatedAt,
  UpdatedAt
} from 'sequelize-typescript';
import User from './UserZPRO';
import Tenant from './TenantZPRO';

interface FlowData {
  nodeList: Array<{
    type: string;
    interactions?: Array<{
      type: string;
      data?: {
        mediaUrl?: string;
        fileName?: string;
      };
    }>;
  }>;
}

@Table({
  freezeTableName: true
})
export default class ChatFlow extends Model {
  @Column
  @PrimaryKey
  @AutoIncrement
  id!: string;

  @Column(DataType.TEXT)
  name!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true
  })
  flow!: FlowData;

  @Column({ defaultValue: true })
  isActive!: boolean;

  @Column({ defaultValue: false })
  isDeleted!: boolean;

  @Column(DataType.TEXT)
  celularTeste!: string | null;

  @ForeignKey(() => User)
  @Column
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @ForeignKey(() => Tenant)
  @Column
  tenantId!: number;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;

  get flow(): FlowData {
    const flowData = this.getDataValue('flow');
    
    if (flowData) {
      for (const node of flowData.nodeList) {
        if (node.type === 'node') {
          for (const interaction of node.interactions || []) {
            if (interaction.type === 'MediaField' && interaction.data?.mediaUrl) {
              const { BACKEND_URL, PROXY_PORT } = process.env;
              const fileName = interaction.data.mediaUrl;
              const tenantId = this.tenantId || (this.tenant && this.tenant.id);

              interaction.data.fileName = fileName;
              interaction.data.mediaUrl = `${BACKEND_URL}:${PROXY_PORT}/public/${tenantId}/${fileName}`;
            }
          }
        }
      }
      return flowData;
    }
    return {} as FlowData;
  }
} 