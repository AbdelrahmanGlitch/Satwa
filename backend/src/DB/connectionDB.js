import mongoose from "mongoose";
import dns from "dns";

const connectionDB = async () => {
  try {
    // A `mongodb+srv://` URI (Atlas's standard format) needs a DNS SRV
    // record lookup to find the actual shard hosts, plus a TXT lookup for
    // replica-set options. This environment's default resolver doesn't
    // handle either record type (ECONNREFUSED), even though ordinary
    // A-record lookups work fine through it — so a public resolver is
    // swapped in just long enough to make the connection, then whatever
    // was configured before is restored.
    const previousServers = dns.getServers();
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        family: 4,
      });
      console.log("Connected to MongoDB");
    } finally {
      dns.setServers(previousServers);
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default connectionDB;
