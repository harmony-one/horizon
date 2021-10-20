// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

// from https://gist.github.com/lhartikk/c7bbc120aa8e58a0e0e781edb9a90497
library Prime {
    // miller rabin test
    function probablyPrime(uint256 n, uint256 prime)
        internal
        pure
        returns (bool)
    {
        if (n == 2 || n == 3) {
            return true;
        }

        if (n % 2 == 0 || n < 2) {
            return false;
        }

        uint256[2] memory values = getValues(n);
        uint256 s = values[0];
        uint256 d = values[1];

        uint256 x = fastModularExponentiation(prime, d, n);

        if (x == 1 || x == n - 1) {
            return true;
        }

        for (uint256 i = s - 1; i > 0; i--) {
            x = fastModularExponentiation(x, 2, n);
            if (x == 1) {
                return false;
            }
            if (x == n - 1) {
                return true;
            }
        }
        return false;
    }

    function fastModularExponentiation(
        uint256 a,
        uint256 b,
        uint256 n
    ) internal pure returns (uint256) {
        a = a % n;
        uint256 result = 1;
        uint256 x = a;

        while (b > 0) {
            uint256 leastSignificantBit = b % 2;
            b = b / 2;

            if (leastSignificantBit == 1) {
                result = result * x;
                result = result % n;
            }
            x = mul(x, x);
            x = x % n;
        }
        return result;
    }

    // Write (n - 1) as 2^s * d
    function getValues(uint256 n) internal pure returns (uint256[2] memory) {
        uint256 s = 0;
        uint256 d = n - 1;
        while (d % 2 == 0) {
            d = d / 2;
            s++;
        }
        uint256[2] memory ret;
        ret[0] = s;
        ret[1] = d;
        return ret;
    }

    // copied from openzeppelin
    // https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/SafeMath.sol
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }
}
