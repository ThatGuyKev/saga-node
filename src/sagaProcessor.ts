import { SagaDefinition, SagaMessage, STEP_PHASE } from "./types";

import { RedisClientType } from "redis";

export class SagaProcessor {
  constructor(
    private sagaDefinitions: SagaDefinition[],
    private publisher: RedisClientType
  ) {}
  subscriber = this.publisher.duplicate();

  async init() {
    await this.publisher.connect();
    await this.subscriber.connect();

    const stepTopics = this.sagaDefinitions.map(
      (definition) => definition.channelName
    );

    console.log("Saga topics created successfully");

    await this.subscriber.subscribe(stepTopics, this.listener.bind(this));
  }

  async listener(message: any) {
    const { saga, payload } = JSON.parse(message.toString()) as SagaMessage;

    const { index, phase } = saga;

    console.log("... message received", saga, payload);
    switch (phase) {
      case STEP_PHASE.STEP_FORWARD:
        const stepForward =
          this.sagaDefinitions[index].phases[STEP_PHASE.STEP_FORWARD]!.command;
        try {
          await stepForward();
          await this.makeStepForward(index + 1, payload);
        } catch (error) {
          await this.makeStepBackward(index - 1, payload);
        }
        return;

      case STEP_PHASE.STEP_BACKWARD:
        const stepBackward =
          this.sagaDefinitions[index].phases[STEP_PHASE.STEP_BACKWARD]!.command;
        await stepBackward();
        await this.makeStepBackward(index - 1, payload);
        return;
    }
  }

  async start(payload: any) {
    await this.makeStepForward(0, payload);
  }

  async makeStepForward(index: number, payload: any) {
    if (index >= this.sagaDefinitions.length) return;

    await this.publisher.publish(
      this.sagaDefinitions[index].channelName,
      JSON.stringify({
        payload,
        saga: { index, phase: STEP_PHASE.STEP_FORWARD },
      })
    );
  }

  async makeStepBackward(index: number, payload: any) {
    if (index < 0) return;

    await this.publisher.publish(
      this.sagaDefinitions[index].channelName,
      JSON.stringify({
        payload,
        saga: { index, phase: STEP_PHASE.STEP_BACKWARD },
      })
    );
  }
}
