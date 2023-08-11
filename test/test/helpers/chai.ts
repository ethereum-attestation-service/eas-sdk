import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiBigInt from 'chai-bigint';

chai.use(chaiAsPromised).use(chaiBigInt);

export default chai;
