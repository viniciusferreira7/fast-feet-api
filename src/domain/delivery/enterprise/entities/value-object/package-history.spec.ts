import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { PackageHistory } from './package-history';
import { PackageStatus } from './package-status';

describe('Package History', () => {
  it('should be able to create a package history', () => {
    const packageId = new UniqueEntityId();
    const packageStatus = PackageStatus.create('pending');
    const authorId = new UniqueEntityId();
    const createdAt = new Date();

    const history = PackageHistory.create({
      packageId,
      packageStatus,
      authorId,
      createdAt,
    });

    expect(history).toBeInstanceOf(PackageHistory);
  });

  it('should be able to access packageId from package history', () => {
    const packageId = new UniqueEntityId('package-123');
    const packageStatus = PackageStatus.create('in_transit');
    const authorId = new UniqueEntityId();
    const createdAt = new Date();

    const history = PackageHistory.create({
      packageId,
      packageStatus,
      authorId,
      createdAt,
    });

    expect(history.packageId).toBe(packageId);
    expect(history.packageId.toString()).toBe('package-123');
  });

  it('should be able to access packageStatus from package history', () => {
    const packageId = new UniqueEntityId();
    const packageStatus = PackageStatus.create('delivered');
    const authorId = new UniqueEntityId();
    const createdAt = new Date();

    const history = PackageHistory.create({
      packageId,
      packageStatus,
      authorId,
      createdAt,
    });

    expect(history.packageStatus).toBe(packageStatus);
    expect(history.packageStatus.value).toBe('delivered');
  });

  it('should be able to access authorId from package history', () => {
    const packageId = new UniqueEntityId();
    const packageStatus = PackageStatus.create('out_for_delivery');
    const authorId = new UniqueEntityId('author-456');
    const createdAt = new Date();

    const history = PackageHistory.create({
      packageId,
      packageStatus,
      authorId,
      createdAt,
    });

    expect(history.authorId).toBe(authorId);
    expect(history.authorId.toString()).toBe('author-456');
  });

  it('should be able to access createdAt from package history', () => {
    const packageId = new UniqueEntityId();
    const packageStatus = PackageStatus.create('pending');
    const authorId = new UniqueEntityId();
    const createdAt = new Date('2024-01-15T10:30:00.000Z');

    const history = PackageHistory.create({
      packageId,
      packageStatus,
      authorId,
      createdAt,
    });

    expect(history.createdAt).toBe(createdAt);
    expect(history.createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should be able to compare two equal package histories', () => {
    const packageId = new UniqueEntityId('package-123');
    const packageStatus = PackageStatus.create('in_transit');
    const authorId = new UniqueEntityId('author-456');
    const createdAt = new Date('2024-01-15T10:30:00.000Z');

    const history1 = PackageHistory.create({
      packageId,
      packageStatus,
      authorId,
      createdAt,
    });

    const history2 = PackageHistory.create({
      packageId,
      packageStatus,
      authorId,
      createdAt,
    });

    expect(history1.equals(history2)).toBe(true);
  });

  it('should be able to compare two different package histories', () => {
    const packageId1 = new UniqueEntityId('package-123');
    const packageId2 = new UniqueEntityId('package-456');
    const packageStatus = PackageStatus.create('in_transit');
    const authorId = new UniqueEntityId('author-456');
    const createdAt = new Date('2024-01-15T10:30:00.000Z');

    const history1 = PackageHistory.create({
      packageId: packageId1,
      packageStatus,
      authorId,
      createdAt,
    });

    const history2 = PackageHistory.create({
      packageId: packageId2,
      packageStatus,
      authorId,
      createdAt,
    });

    expect(history1.equals(history2)).toBe(false);
  });

  it('should be able to create package history with different statuses', () => {
    const packageId = new UniqueEntityId();
    const authorId = new UniqueEntityId();
    const createdAt = new Date();

    const statuses = [
      'pending',
      'awaiting_pickup',
      'picked_up',
      'at_distribution_center',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'failed_delivery',
      'returned',
      'canceled',
    ];

    statuses.forEach((statusValue) => {
      const packageStatus = PackageStatus.create(statusValue);
      const history = PackageHistory.create({
        packageId,
        packageStatus,
        authorId,
        createdAt,
      });

      expect(history).toBeInstanceOf(PackageHistory);
      expect(history.packageStatus.value).toBe(statusValue);
    });
  });

  it('should preserve all properties when creating package history', () => {
    const packageId = new UniqueEntityId('pkg-001');
    const packageStatus = PackageStatus.create('delivered');
    const authorId = new UniqueEntityId('auth-001');
    const createdAt = new Date('2024-06-20T15:45:30.000Z');

    const history = PackageHistory.create({
      packageId,
      packageStatus,
      authorId,
      createdAt,
    });

    expect(history.packageId.toString()).toBe('pkg-001');
    expect(history.packageStatus.value).toBe('delivered');
    expect(history.authorId.toString()).toBe('auth-001');
    expect(history.createdAt.toISOString()).toBe('2024-06-20T15:45:30.000Z');
  });
});
