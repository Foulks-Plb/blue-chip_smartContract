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

    mapping(uint256 => Match) public matchId;
    mapping(uint256 => ResultMatch) public idResult;
    mapping(uint256 => MatchData) public idData;

    mapping(uint256 => mapping(address => uint256)) public idAddressNbrbet;
    mapping(uint256 => mapping(address => mapping(uint256 => ResultMatch)))
        public idAddressBetResult;

    mapping(uint256 => mapping(address => mapping(uint256 => uint256)))
        public idAddressBetLeverage;

    constructor() {}

    function bet(
        uint256 _id,
        uint256 _leverage,
        bool _winA,
        bool _winB,
        bool _equality
    ) public payable {
        Match memory _match = matchId[_id];

        require(_match.isActive, "not active");
        require(_match.endAt > block.timestamp, "out time");
        require(_match.price * _leverage == msg.value, "wrong value");
        require(
            (_winA && !_winB && !_equality) ||
                (!_winA && _winB && !_equality) ||
                (!_winA && !_winB && _equality),
            "wrong logic"
        );

        uint256 _betId = idAddressNbrbet[_id][msg.sender];
        idAddressBetResult[_id][msg.sender][_betId] = ResultMatch(
            _winA,
            _winB,
            _equality
        );

        if (_winA) {
            idData[_id].inA += _leverage;
        } else if (_winB) {
            idData[_id].inB += _leverage;
        } else if (_equality) {
            idData[_id].inEquality += _leverage;
        }

        idData[_id].pricePool += msg.value;
        idAddressBetLeverage[_id][msg.sender][_betId] += _leverage;

        idAddressNbrbet[_id][msg.sender]++;
    }

    function claim(uint256 _id) public {}

    function setMatch(
        uint256 _id,
        bool _isActive,
        uint256 _price,
        uint256 _endAt
    ) public onlyOwner {
        matchId[_id] = Match(_isActive, _price, _endAt);
    }

    function getTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}
