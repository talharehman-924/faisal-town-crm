-- CreateTable
CREATE TABLE "BuyerPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "minBudget" REAL NOT NULL,
    "maxBudget" REAL NOT NULL,
    "preferredType" TEXT NOT NULL,
    "preferredLocation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerPreference_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BuyerPreference_leadId_key" ON "BuyerPreference"("leadId");
