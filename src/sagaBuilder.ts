import { RedisClientType } from "redis";
import { SagaProcessor } from "./sagaProcessor";
import { Command, SagaDefinition, STEP_PHASE } from "./types";

export class SagaDefinitionBuilder {
  constructor(private redisClient: RedisClientType) {}
  index: number | null = null;
  sagaDefinitions: SagaDefinition[] = [];

  private checkIndex() {
    if (this.index === null) {
      throw new Error("");
    }
  }

  step(channelName: string): SagaDefinitionBuilder {
    this.index = this.index === null ? 0 : this.index + 1;
    this.sagaDefinitions = [
      ...this.sagaDefinitions,
      { channelName, phases: {} },
    ];
    return this;
  }

  onReply(command: Command): SagaDefinitionBuilder {
    this.checkIndex();
    this.sagaDefinitions[this.index!].phases[STEP_PHASE.STEP_FORWARD] = {
      command,
    };
    return this;
  }
  withCompensation(command: Command): SagaDefinitionBuilder {
    this.checkIndex();
    this.sagaDefinitions[this.index!].phases[STEP_PHASE.STEP_BACKWARD] = {
      command,
    };
    return this;
  }

  async build(): Promise<SagaProcessor> {
    const sagaProcessor = new SagaProcessor(
      this.sagaDefinitions,
      this.redisClient
    );
    await sagaProcessor.init();
    return sagaProcessor;
  }
}
