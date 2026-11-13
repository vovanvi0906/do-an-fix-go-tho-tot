// Standalone Nest application: no AppModule, dotenv, project auth or recommendation bootstrap.
const {resolve}=require('path');
require('@babel/register')({configFile:resolve(__dirname,'../../.babelrc')});
require('reflect-metadata');
const {readFileSync,statSync}=require('fs');
const {PrismaClient}=require('@prisma/client');
const {Module}=require('@nestjs/common');
const {NestFactory}=require('@nestjs/core');
const {ResearchService}=require('../../src/face-research/research.service');
const {ResearchController,ResearchAuthGuard,ResearchCaptureGuard}=require('../../src/face-research/research.controller');
async function start(config) {
  const u=new URL(config.databaseUrl), ai=new URL(config.aiUrl);
  if(u.hostname!=='127.0.0.1'||!u.port||!/^\/fixgo_face_research_[a-f0-9]+$/.test(u.pathname)||ai.hostname!=='127.0.0.1'||ai.protocol!=='http:'||!ai.port)throw new Error('ISOLATED_RESEARCH_ENDPOINTS_REQUIRED');
  for(const key of ['jwtKey','nonceKey','aiToken'])if(typeof config[key]!=='string'||config[key].length<32)throw new Error('RESEARCH_KEYS_REQUIRED');
  if(config.captureApproved===true&&(!config.protocolReference||!config.participants))throw new Error('APPROVED_RESEARCH_PROTOCOL_REQUIRED');
  const db=new PrismaClient({datasources:{db:{url:config.databaseUrl}}});
  const service=new ResearchService(db,config);await service.assertEnvironment();
  class ResearchModule{}
  Module({controllers:[ResearchController],providers:[{provide:ResearchService,useValue:service},ResearchAuthGuard,ResearchCaptureGuard]})(ResearchModule);
  const app=await NestFactory.create(ResearchModule,{logger:false});
  const express=require('express');app.use(express.json({limit:'16kb'}));
  await app.listen(config.port??0,'127.0.0.1');
  return {app,db,service,url:await app.getUrl(),close:async()=>{await app.close();await db.$disconnect();}};
}
module.exports={start};
if(require.main===module){
  (async()=>{const path=process.argv[2];if(!path||(statSync(path).mode&0o077))throw new Error('PRIVATE_RESEARCH_CONFIG_REQUIRED');const instance=await start(JSON.parse(readFileSync(path,'utf8')));process.stdout.write(JSON.stringify({url:instance.url,researchOnly:true})+'\n');for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await instance.close();process.exit(0);});})().catch(()=>{process.stderr.write('RESEARCH_START_FAILED\n');process.exitCode=1;});
}
