pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Bc is Ownable {
    struct Match {
        bool isActive;
        uint256 price;
        uint256 endAt;
    }

    struct MatchData {
        uint256 pricePool;
        uint256 inA;
        uint256 inB;
        uint256 inEquality;
    }

    struct ResultMatch {
        bool winA;
        bool winB;
        bool equality;
    }

    mapping(uint256 => Match) public idToMatch;
    mapping(uint256 => ResultMatch) public idToResult;
    mapping(uint256 => MatchData) public idToMatchData;
    mapping(uint256 => mapping(address => ResultMatch)) public addressToResult;
    mapping(uint256 => mapping(address => uint256)) public addressLeverage;

    constructor() {}

    function bet(
        uint256 _id,
        uint256 _leverage,
        bool _winA,
        bool _winB,
        bool _equality
    ) public payable {
        Match memory _match = idToMatch[_id];

        require(_match.isActive, "not active");
        require(_match.endAt > block.timestamp, "out time");
        require(_match.price * _leverage == msg.value, "wrong value");
        require(
            (_winA && !_winB && !_equality) ||
                (!_winA && _winB && !_equality) ||
                (!_winA && !_winB && _equality),
            "wrong logic"
        );

        addressToResult[_id][msg.sender] = ResultMatch(_winA, _winB, _equality);
        // a verifier
        idToMatchData[_id].pricePool += msg.value;
        addressLeverage[_id][msg.sender] += _leverage;

        // a verifier
        if (_winA) {
            idToMatchData[_id].inA += _leverage;
        } else if (_winB) {
            idToMatchData[_id].inB += _leverage;
        } else if (_equality) {
            idToMatchData[_id].inEquality += _leverage;
        }
    }

    function claim(uint256 _id) public {}

    function setMatch(
        uint256 _id,
        bool _isActive,
        uint256 _price,
        uint256 _endAt
    ) public onlyOwner {
        idToMatch[_id] = Match(_isActive, _price, _endAt);
    }

    function getTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}
