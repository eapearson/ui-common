# Erik's Speculative Testing Framework

## Introduction

Testing is arriving at KBase in bits and pieces. One area at which it has not yet truly arrived as UI development. We have not yet chosen a Javascript testing framework. This is an attempt to explore the testing space, building a testing framework from the ground up to learn how different facets of JS software can be tested. There are unique challenges, and I'm sure that most mature testing frameworks have met them all.

## Goals

Unit testing - testing expected vs actual output for expected cases of success and failure for object methods
Object testing - test the shape of objects (typing) to ensure that they comply with their definition
Property testing - test object property values against their expected range
Exception testing - force exceptions for methods, ensure that they are thrown; conversely, catch cases of exceptions when not expected
Mutation testing - test arguments to ensure they are mutated to expected values, and not when they shouldn't be
Environment testing - test the global envivironment for modification
Performance testing - tests that are given a performance range and test and report against it
Coverage testing - given inputs of a given type, generate massive numbers of inputs of valid and invalid configuration


## Thoughts

Basically we are testing objects and their methods.

### Coverage

It is good to test a broad range of input values, especially at limits. However, not all values can be tested; it is just not practical.

To optimize we can:

- test all forms of valid input
    - not all "forms" not "values"
- test at and around the limits
- produce a large number of automated and randomized tests

For instance, if an input is a string of between 5 and 25 characters in unicode, we can ensure that we test with simple strings of 4, 5, 6, 24, 25, 26 characters to test at and around the limits. A simple string might be "aaa". We can also produce strings of random characters and length within the acceptable range (5-25), and in the unacceptable ranges (0-4), 26 to the limit of strings in JS. 


### Limits

Actually, the issue of limits is interesting. String length is not bounded in Javascript, but there are of course practical limitations. Also, depending on what is being done with the string, there may be serious deliterious effects on the performance and stability if limits are not imposed on string length. However, practically speaking, without guards for all arguments which check for type and range, it is not possible to impose such limits. The best we can probably hope for is to provide such guards for all code which interfaces with externally supplied data. There is no tainting in JS, so this needs to be enforced by discipline. For the sake of efficiency, we may be able to trust some external data sources, such as well-tested interfaces with established limits.

## Breakdown
