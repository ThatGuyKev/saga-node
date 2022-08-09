import { createClient, RedisClientType } from "redis";
import { SagaDefinitionBuilder } from "../sagaBuilder";
let client: RedisClientType;

describe("Saga", () => {
  beforeAll(async () => {
    client = createClient({ url: "redis://localhost:6379" });
  });
  it("should work xD", async () => {
    const joinCampaign = new SagaDefinitionBuilder(client);
    joinCampaign
      .step("checkCampValidity")
      .onReply(async () => {
        console.log("Camp is Valid");
      })
      .withCompensation(async () => {
        console.log("checkCampValidity backward");
      });
    joinCampaign
      .step("deductAmount")
      .onReply(async () => {
        console.log("Deduct Amount");
      })
      .withCompensation(async () => {
        console.log("Refund Amount");
      });

    joinCampaign
      .step("GenerateTicket")
      .onReply(async () => {
        console.log("Generate Tickets");
      })
      .withCompensation(async () => {
        console.log("Remove Tickets");
      });

    joinCampaign
      .step("UpdateCampStatus")
      .onReply(async () => {
        console.log("Updated Camp Status");
      })
      .withCompensation(async () => {
        console.log("revert camp status");
      });

    const sagaProcessor = await joinCampaign.build();
    await sagaProcessor.start({ id: 2 });
  });
  afterAll(() => {
    client.disconnect();
  });
});
