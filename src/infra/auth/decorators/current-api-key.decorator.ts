import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const CurrentAPiKey = createParamDecorator(
  (_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || user.type !== 'api-key') {
      throw new UnauthorizedException('API key required');
    }

    return user;
  }
);
