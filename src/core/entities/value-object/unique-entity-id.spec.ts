import { UniqueEntityId } from './unique-entity-id';

describe('Unique entity ID', () => {
  it('should be able to create id if value doest not passed into constructor', () => {
    const value = new UniqueEntityId();

    expect(value).toBeInstanceOf(UniqueEntityId);
  });

  it('should be able to pass value into constructor', () => {
    const value = new UniqueEntityId('value-id');

    expect(value).toBeInstanceOf(UniqueEntityId);
  });

  it('should be able to return value from class', () => {
    const value1 = new UniqueEntityId();
    const value2 = new UniqueEntityId('value-id');

    expect(value1.toString()).toEqual(expect.any(String));
    expect(value2.toString()).toEqual('value-id');
  });

  it('should be able to compare different values', () => {
    const value1 = new UniqueEntityId();
    const value2 = new UniqueEntityId('value-id');

    expect(value1.equals(value2)).toBeFalsy();
  });
});
