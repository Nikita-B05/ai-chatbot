ALTER TABLE "Chat" ADD COLUMN "questionaireMode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "clientState" jsonb;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "rateType" varchar;--> statement-breakpoint
ALTER TABLE "Message_v2" ADD COLUMN "stateSnapshot" jsonb;--> statement-breakpoint
ALTER TABLE "Message_v2" ADD COLUMN "answeredQuestionId" varchar(10);