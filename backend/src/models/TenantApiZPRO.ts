import { Model, Table, Column, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import Tenant from './TenantZPRO';

@Table
export default class TenantApi extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    id!: number;

    @Column
    apiToken!: string;

    @ForeignKey(() => Tenant)
    @Column
    tenantId!: number;

    @BelongsTo(() => Tenant)
    tenant!: Tenant;

    @CreatedAt
    createdAt!: Date;

    @UpdatedAt
    updatedAt!: Date;
} 