import { HttpRequest, HttpRequestMethod } from "kinvey-js-sdk/lib/http";
import { NetworkError, KinveyError } from "kinvey-js-sdk/lib/errors";
import nock from "nock";
import { URL } from "url";
import { expect } from "chai";
import { http } from "../src/http";

describe("Http", function() {
  it("should throw an error", async function() {
    const request = new HttpRequest();

    try {
      await http.send(request.toPlainObject());
      throw new Error("This test should throw an error.");
    } catch (error) {
      expect(error).to.be.instanceOf(KinveyError);
    }
  });

  it("should throw an error if the request times out", async function() {
    const timeout = 1000;
    const request = {
      method: HttpRequestMethod.GET,
      url: "http://kinvey.com",
      timeout
    };

    const url = new URL(request.url);
    const scope = nock(url.origin)
      .get(url.pathname)
      .delayConnection(timeout + 1)
      .reply(200);

    try {
      await http.send(request);
      throw new Error("This test should throw a NetworkError.");
    } catch (error) {
      expect(error).to.be.instanceOf(NetworkError);
      expect(error.message).to.equal(
        "The request was made but a response was not received."
      );
      expect(error.debug).to.equal("Please check your network connection.");
    }

    expect(scope.isDone()).to.equal(true);
  });

  it("should set the status code for the response", async function() {
    const request = {
      method: HttpRequestMethod.GET,
      url: "http://kinvey.com"
    };
    const url = new URL(request.url);
    const statusCode = 200;
    const scope = nock(url.origin)
      .get(url.pathname)
      .reply(statusCode);
    const response = await http.send(request);
    expect(response.statusCode).to.equal(statusCode);
    expect(scope.isDone()).to.equal(true);
  });

  it("should set the headers for the response", async function() {
    const request = {
      method: HttpRequestMethod.GET,
      url: "http://kinvey.com"
    };
    const url = new URL(request.url);
    const headers = { "x-foo": "bar" };
    const scope = nock(url.origin)
      .get(url.pathname)
      .reply(200, {}, headers);
    const response = await http.send(request);
    Object.keys(headers).forEach(key =>
      expect(response.headers[key]).to.equal(headers[key])
    );
    expect(scope.isDone()).to.equal(true);
  });

  it("should set the data for the response", async function() {
    const request = {
      method: HttpRequestMethod.GET,
      url: "http://kinvey.com"
    };
    const url = new URL(request.url);
    const data = { foo: "bar" };
    const scope = nock(url.origin)
      .get(url.pathname)
      .reply(200, JSON.stringify(data), {
        "Content-Type": "application/json"
      });
    const response = await http.send(request);
    expect(response.data).to.deep.equal(data);
    expect(scope.isDone()).to.equal(true);
  });
});
