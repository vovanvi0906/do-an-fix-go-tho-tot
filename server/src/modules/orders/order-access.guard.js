import { Injectable, Dependencies, ConflictException } from '@nestjs/common';
import { OrderWorkflowService } from './order-workflow.service';

@Injectable()
@Dependencies(OrderWorkflowService)
export class OrderAccessGuard {
  constructor(workflow) {
    this.workflow = workflow;
  }
  async canActivate(context) {
    const req = context.switchToHttp().getRequest();
    const { order } = await this.workflow.access(
      req.params.id,
      req.user?.userId,
      ['WORKER'],
    );
    if (
      ![
        'MATCHED',
        'ASSIGNED',
        'WORKER_EN_ROUTE',
        'WORKER_ARRIVING',
        'ARRIVED',
        'IN_PROGRESS',
      ].includes(order.status)
    )
      throw new ConflictException('FACE_STAGE_NOT_ALLOWED');
    return true;
  }
}
