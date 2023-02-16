import { Logger } from '@aws-amplify/core';
import { v4 } from 'uuid';
import { MachineManager } from '../src/stateMachine/stateMachineManager';
import { Context, TickEvent, tickTockMachine } from './utils/tickTockMachine';
import { Machine } from '../src/stateMachine/machine';
import { TransitionAction } from '../src/stateMachine/types';

jest.mock('uuid');

describe(MachineManager.name, () => {
	const mockLogger = {
		debug: jest.fn(),
	} as any as Logger;
	let manager = new MachineManager({
		name: 'TestManager',
		logger: mockLogger,
	});

	beforeEach(() => {
		jest.resetAllMocks();
		manager = new MachineManager({
			name: 'TestManager',
			logger: mockLogger,
		});
	});

	describe('send()', () => {
		beforeEach(async () => {
			await manager.addMachineIfAbsent(tickTockMachine());
		});

		it('should relay events to containing machines', async () => {
			expect.assertions(1);
			const machineName = tickTockMachine().name;
			// @ts-ignore
			const machine = manager._machines[machineName];
			const mockAccept = jest.spyOn(machine, 'accept');
			const tick = { toMachine: machineName, type: 'tick', payload: {} };
			await manager.send(tick);
			expect(mockAccept).toBeCalledWith(tick);
		});

		it("should throw if event is sent to machine that doesn't exist", async () => {
			expect.assertions(1);
			const invalidEvent = {
				toMachine: 'invalidMachine',
				type: 'tick',
				payload: {},
			};
			try {
				await manager.send(invalidEvent);
			} catch (e) {
				expect(e.message).toEqual(
					expect.stringContaining(
						`No state machine ${invalidEvent.toMachine} configured`
					)
				);
			}
		});

		it('should handle concurrent events', async () => {
			const tickEvent = {
				type: 'tick',
				payload: {},
				toMachine: tickTockMachine().name,
			};
			const contexts = await Promise.all([
				manager.send(tickEvent),
				manager.send(tickEvent),
				manager.send(tickEvent),
			]);
		}, 30000);
	});

	describe('addMachineIfAbsent()', () => {
		it('should add machine', async () => {
			const machine = tickTockMachine();
			expect.assertions(1);
			await manager.addMachineIfAbsent(machine);
			// @ts-ignore
			expect(manager._machines[machine.name]).toBe(machine);
		});

		it('should not affect current events', async () => {
			expect.assertions(1);
			const mockUUID = 'MOCK_UUID';
			(v4 as jest.Mock).mockReturnValue(mockUUID);
			const sendToInvalidMachineAction: TransitionAction<
				Context,
				TickEvent
			> = async (ctxt, event, broker) => {
				await new Promise<void>(resolve => {
					setTimeout(() => {
						resolve();
					}, 500);
				});
				broker.dispatch({
					toMachine: 'AnotherMachine',
					type: 'foo',
					payload: 'bar',
				});
			};
			// This machine should fail if 'AnotherMachine' hasn't been added to manager.
			const machineSendingInvalidEvent = tickTockMachine(
				sendToInvalidMachineAction
			);
			const anothermachine = new Machine<{}, any, any>({
				context: {},
				name: 'AnotherMachine',
				initial: 'StateA',
				states: {
					StateA: {},
				},
			});
			await manager.addMachineIfAbsent(machineSendingInvalidEvent);
			await Promise.all([
				manager.send({
					type: 'tick',
					payload: {},
					toMachine: machineSendingInvalidEvent.name,
				}),
				manager.addMachineIfAbsent(anothermachine),
			]);
			expect(mockLogger.debug).toBeCalledWith(
				expect.stringContaining(
					`Cannot route event name foo to machine ${anothermachine.name}. Event id ${mockUUID}`
				)
			);
		});

		it('should log if added manchine name already exists', async () => {
			expect.assertions(2);
			await manager.addMachineIfAbsent(tickTockMachine());
			expect(mockLogger.debug).not.toBeCalled();
			await manager.addMachineIfAbsent(tickTockMachine());
			expect(mockLogger.debug).toBeCalledWith(
				expect.stringContaining('already exists in machine manager')
			);
		});
	});

	describe('getCurrentState', () => {
		it('should return the state of specified machine', async () => {
			const machine = tickTockMachine();
			await manager.addMachineIfAbsent(machine);
			expect(await manager.getCurrentState(machine.name)).toEqual({
				context: { events: [] },
				currentState: 'StateA',
			});
		});
	});
});
