/**
 * Represents the left side of an Either type, typically used for error values.
 * @template L The type of the left (error) value
 * @template R The type of the right (success) value
 */
export class Left<L, R> {
  readonly value: L;

  constructor(value: L) {
    this.value = value;
  }

  /**
   * Type guard to check if this is a Left instance.
   * @returns true
   */
  isLeft(): this is Left<L, R> {
    return true;
  }

  /**
   * Type guard to check if this is a Right instance.
   * @returns false
   */
  isRight(): this is Right<L, R> {
    return false;
  }
}

/**
 * Represents the right side of an Either type, typically used for success values.
 * @template L The type of the left (error) value
 * @template R The type of the right (success) value
 */
export class Right<L, R> {
  readonly value: R;

  constructor(value: R) {
    this.value = value;
  }

  /**
   * Type guard to check if this is a Left instance.
   * @returns false
   */
  isLeft(): this is Left<L, R> {
    return false;
  }

  /**
   * Type guard to check if this is a Right instance.
   * @returns true
   */
  isRight(): this is Right<L, R> {
    return true;
  }
}

/**
 * Either type represents a value that can be either Left (error) or Right (success).
 * This is a functional programming pattern for handling errors without exceptions.
 * @template L The type of the left (error) value
 * @template R The type of the right (success) value
 */
export type Either<L, R> = Left<L, R> | Right<L, R>;

/**
 * Creates a Left instance, typically used to represent an error or failure case.
 * @template L The type of the left (error) value
 * @template R The type of the right (success) value
 * @param value The error value to wrap
 * @returns An Either instance containing the left value
 */
export const left = <L, R>(value: L): Either<L, R> => {
  return new Left<L, R>(value);
};

/**
 * Creates a Right instance, typically used to represent a success case.
 * @template L The type of the left (error) value
 * @template R The type of the right (success) value
 * @param value The success value to wrap
 * @returns An Either instance containing the right value
 */
export const right = <L, R>(value: R): Either<L, R> => {
  return new Right<L, R>(value);
};
