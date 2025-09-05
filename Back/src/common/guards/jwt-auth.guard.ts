import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('JwtAuthGuard 실행됨');
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('JwtAuthGuard handleRequest:', { err, user, info });
    
    if (err || !user) {
      throw err || new UnauthorizedException('JWT 인증 실패');
    }
    return user;
  }
}
