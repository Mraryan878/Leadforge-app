-- CreateTable
CREATE TABLE "stage_history" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "from_stage_id" INTEGER NOT NULL,
    "to_stage_id" INTEGER NOT NULL,
    "changed_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "stage_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_from_stage_id_fkey" FOREIGN KEY ("from_stage_id") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_to_stage_id_fkey" FOREIGN KEY ("to_stage_id") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
