import { Model, Table, Column, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import UserZPRO from './UserZPRO';
import GroupMessagesZPRO from './GroupMessagesZPRO';

interface UsersPrivateGroupsAttributes {
  id: number;
  groupId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

@Table({
  freezeTableName: true
})
export default class UsersPrivateGroups extends Model<UsersPrivateGroupsAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id!: number;

  @ForeignKey(() => GroupMessagesZPRO)
  @Column
  groupId!: number;

  @BelongsTo(() => GroupMessagesZPRO)
  group!: GroupMessagesZPRO;

  @ForeignKey(() => UserZPRO)
  @Column
  userId!: number;

  @BelongsTo(() => UserZPRO)
  user!: UserZPRO;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
} 