/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const chai = require('chai');
const {filterByTag} = require('vc-api-test-suite-implementations');
const {klona} = require('klona');
const {v4: uuidv4} = require('uuid');
const {validVc} = require('../credentials');

const should = chai.should();
// only use implementations with `Ed25519 2020` issuers.
const {
  match: issuerMatches
} = filterByTag({tags: ['Ed25519Signature2020'], property: 'issuers'});
const {
  match: verifierMatches
} = filterByTag({tags: ['VC-API'], property: 'verifiers'});

describe('Ed25519Signature2020 (interop)', function() {
  // this will tell the report
  // to make an interop matrix with this suite
  this.matrix = true;
  this.report = true;
  this.implemented = [...verifierMatches.keys()];
  this.rowLabel = 'Issuer';
  this.columnLabel = 'Verifier';
  for(const [issuerName, {issuers}] of issuerMatches) {
    let issuedVc;
    before(async function() {
      const issuer = issuers.find(issuer =>
        issuer.tags.has('Ed25519Signature2020'));
      const {settings: {id: issuerId, options}} = issuer;
      const body = {credential: klona(validVc), options};
      body.credential.id = `urn:uuid:${uuidv4()}`;
      body.credential.issuer = issuerId;
      const {data} = await issuer.post({json: body});
      issuedVc = data;
    });
    for(const [verifierName, {verifiers}] of verifierMatches) {
      const verifier = verifiers.find(verifier =>
        verifier.tags.has('VC-API'));
      it(`${verifierName} should verify ${issuerName}`, async function() {
        this.test.cell = {rowId: issuerName, columnId: verifierName};
        const body = {
          verifiableCredential: issuedVc,
          options: {
            checks: ['proof']
          }
        };
        const {result, error} = await verifier.post({json: body});
        should.not.exist(error, 'Expected verifier to not error.');
        should.exist(result, 'Expected result from verifier.');
        should.exist(result.status, 'Expected verifier to return an HTTP' +
          'status code');
        result.status.should.equal(200, 'Expected HTTP status code to be 200.');
      });
    }
  }
});
