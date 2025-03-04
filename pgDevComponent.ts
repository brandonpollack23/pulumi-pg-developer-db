import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";

export interface PgDevComponentArgs {
  applicationName: string;
  hostLocation?: HostLocation;
  /// The version of Postgres to use. Defaults to "15".
  postgresVersionTag?: string;
  postgresPort?: number;
  password?: string;
}

export enum HostLocation {
  LocalDocker,
}

export class PgDevComponent extends pulumi.ComponentResource {
  address: pulumi.Output<string>;
  databaseName: pulumi.Output<string>;
  username: pulumi.Output<string>;
  password: pulumi.Output<string>;
  pgContainer: docker.Container;

  constructor(
    name: string,
    args: PgDevComponentArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super("pg-dev:index:PgDevComponent", name, args, opts);
    let volumeName = args.applicationName + "_pg_data";
    let databaseVolume = new docker.Volume(volumeName, { name: volumeName });

    let containerName = args.applicationName + "_dev_postgres_db";
    let imageName = "postgres:" + (args.postgresVersionTag ?? "15");
    let portNumber = args.postgresPort ?? 5432;
    let pgContainer = new docker.Container(containerName, {
      name: containerName,
      image: imageName,
      ports: [{ internal: 5432, external: portNumber }],
      volumes: [{ volumeName: databaseVolume.name }],
      restart: "always",
      envs: ["POSTGRES_PASSWORD=postgres", `POSTGRES_DB=${args.applicationName}_dev`, "POSTGRES_USER=postgres"],
    });

    this.address = pulumi.output("postgres://postgres:postgres@localhost:" + portNumber + "/" + args.applicationName + "_dev");
    this.databaseName = pulumi.output(args.applicationName + "_dev");
    this.username = pulumi.output("postgres");
    this.password = pulumi.output("postgres");
    this.pgContainer = pgContainer;
  }
}
