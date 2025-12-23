import { type Either, left, right } from './either';

function doSomething(shouldBeSuccess: boolean): Either<string, string> {
  if (!shouldBeSuccess) {
    return left('error');
  }

  return right('success');
}

test('error result', () => {
  const result = doSomething(false);

  expect(result.isLeft()).toBeTruthy();
  expect(result.isRight()).toBeFalsy();
});

test('success result', () => {
  const result = doSomething(true);

  expect(result.isRight()).toBeTruthy();
  expect(result.isLeft()).toBeFalsy();
});
