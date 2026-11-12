-- CreateTable
CREATE TABLE "UserDB" (
    "userID" TEXT NOT NULL,
    "userProfileLoc" TEXT,
    "userNameEncrypted" TEXT NOT NULL,
    "userNameEncryptedIv" TEXT NOT NULL,
    "userNameEncryptedAuthTag" TEXT NOT NULL,
    "userNameEncryptedKeyVersion" INTEGER NOT NULL,
    "emailEncrypted" TEXT NOT NULL,
    "emailEncryptedIv" TEXT NOT NULL,
    "emailEncryptedAuthTag" TEXT NOT NULL,
    "emailEncryptedKeyVersion" INTEGER NOT NULL,
    "emailBlindIndex" TEXT NOT NULL,
    "passwordHashed" TEXT NOT NULL,

    CONSTRAINT "UserDB_pkey" PRIMARY KEY ("userID")
);

-- CreateTable
CREATE TABLE "EventsDB" (
    "id" TEXT NOT NULL,
    "today" TIMESTAMPTZ(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EventsDB_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventsDB" ADD CONSTRAINT "EventsDB_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserDB"("userID") ON DELETE RESTRICT ON UPDATE CASCADE;
