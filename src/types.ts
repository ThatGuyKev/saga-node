export enum STEP_PHASE {
    STEP_FORWARD = "STEP_FORWARD",
    STEP_BACKWARD = "STEP_BACKWARD",
  }
  
  export type SagaMessage<P = any> = {
    payload: P;
    saga: {
      index: number;
      phase: STEP_PHASE;
    };
  };
  
  export type Command<P = any, RES = void> = (payload?: P) => Promise<RES>;
  
  export type SagaDefinition = {
    channelName: string;
    phases: { [key in STEP_PHASE]?: { command: Command } };
  };
  